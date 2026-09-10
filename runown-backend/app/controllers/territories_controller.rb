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
  def claim
    lat = params[:lat].to_f
    lng = params[:lng].to_f

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

  def territory_params
    params.permit(:name, :lat, :lng)
  end
end
