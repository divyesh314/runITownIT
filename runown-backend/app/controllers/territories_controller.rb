class TerritoriesController < ApplicationController
  before_action :authenticate_user!, only: %i[create claim]

  # GET /api/territories
  def index
    render json: Territory.all.includes(:owner)
  end

  # GET /api/territories/:id
  def show
    render json: Territory.find(params[:id])
  end

  # POST /api/territories - seeds a new (unclaimed) zone on the map, e.g.
  # from an admin tool laying out the city grid. Nobody owns it until
  # someone runs through it (POST /api/territories/claim) or wins a
  # challenge for it.
  def create
    territory = Territory.new(territory_params)
    if territory.save
      render json: territory, status: :created
    else
      render json: { errors: territory.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # POST /api/territories/claim
  # Body: { lat, lng, name (only used if this spot has never been seen
  # before) }. Finds the nearest territory to that GPS point; if none
  # exists yet within Territory::CLAIM_RADIUS_METERS, creates one. If it's
  # unclaimed, the current user takes it. If someone already owns it, this
  # returns a conflict - use a Challenge to take it from them instead.
  #
  # SECURITY: this is a single client-reported point with no GPS trace behind
  # it (unlike POST /api/runs/:id/verify, which checks a full recorded path
  # via GpsValidator). That makes it inherently spoofable - a modified
  # request, a mocked-location app, or a rooted device can send any lat/lng
  # here. We can't fully solve "trust a single point" without requiring a
  # path (see runs_controller#verify, the real verification path), but we
  # do reject the obviously-impossible case: claiming somewhere you could
  # not plausibly have just run to. See CHALLENGES.md for the full writeup.
  def claim
    lat = params[:lat].to_f
    lng = params[:lng].to_f

    unless lat.between?(-90, 90) && lng.between?(-180, 180)
      return render json: { error: 'That is not a valid location.' }, status: :unprocessable_entity
    end

    if (reason = implausible_claim_reason(lat, lng))
      return render json: { error: reason }, status: :unprocessable_entity
    end

    territory = Territory.near(lat, lng) || Territory.create!(
      name: params[:name].presence || "Zone (#{lat.round(4)}, #{lng.round(4)})",
      lat: lat,
      lng: lng
    )

    if territory.claimed? && territory.owner_id != current_user.id
      return render json: {
        error: "#{territory.name} is already owned by #{territory.owner.name} - start a challenge to take it",
        territory: territory
      }, status: :conflict
    end

    territory.assign_owner!(current_user)
    render json: { message: "You claimed #{territory.name}!", territory: territory }
  end

  private

  # A generous sprint pace - fast enough that no genuine runner ever trips
  # it, slow enough to catch "claimed in Waterloo, claimed in Tokyo 8
  # seconds later" spoofing between two one-tap claims.
  MAX_PLAUSIBLE_SPEED_MPS = 8.0

  # Nobody, however fast, has a reason to fire off two of these within a
  # few seconds of each other - this alone stops naive claim-spamming even
  # when the second point is right next door.
  MIN_SECONDS_BETWEEN_CLAIMS = 15

  def implausible_claim_reason(lat, lng)
    last = current_user.territories.where.not(claimed_at: nil).order(claimed_at: :desc).first
    return nil unless last

    elapsed = Time.current - last.claimed_at
    return nil if elapsed <= 0

    if elapsed < MIN_SECONDS_BETWEEN_CLAIMS
      return "Give it a few seconds between claims (#{elapsed.round}s since your last one)."
    end

    distance = GpsValidator.haversine_distance_meters(lat, lng, last.lat, last.lng)
    implied_speed = distance / elapsed
    return nil if implied_speed <= MAX_PLAUSIBLE_SPEED_MPS

    "That's #{(distance / 1000.0).round(1)}km from your last claim, #{elapsed.round}s ago - " \
      "too far to have run there. Start a tracked run instead so we can verify the route."
  end

  def territory_params
    params.permit(:name, :lat, :lng)
  end
end
