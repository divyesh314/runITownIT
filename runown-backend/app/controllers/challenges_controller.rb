class ChallengesController < ApplicationController
  before_action :authenticate_user!
  before_action :set_challenge, only: %i[show accept decline complete]

  # GET /api/challenges
  def index
    render json: Challenge.where(challenger: current_user).or(
      Challenge.joins(:territory).where(territories: { owner_id: current_user.id })
    ).includes(:challenger, :territory, :winner)
  end

  # GET /api/challenges/:id
  def show
    render json: @challenge
  end

  # POST /api/challenges - challenge the current owner of a territory
  def create
    challenge = current_user.challenges.new(challenge_params)
    if challenge.save
      render json: challenge, status: :created
    else
      render json: { errors: challenge.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # POST /api/challenges/:id/accept - only the territory's current owner can accept
  def accept
    return forbid_unless_owner! unless owner?

    @challenge.accept!
    render json: @challenge
  end

  # POST /api/challenges/:id/decline
  def decline
    return forbid_unless_owner! unless owner?

    @challenge.decline!
    render json: @challenge
  end

  # POST /api/challenges/:id/complete - either racer reports the result
  # once both have run the route; winner_id must be one of the two racers.
  def complete
    @challenge.complete!(winner: User.find(params[:winner_id]))
    render json: @challenge
  rescue ArgumentError => e
    render json: { error: e.message }, status: :unprocessable_entity
  end

  private

  def set_challenge
    @challenge = Challenge.find(params[:id])
  end

  def owner?
    @challenge.territory.owner_id == current_user.id
  end

  def forbid_unless_owner!
    render json: { error: 'Only the current owner of the territory can respond to this challenge' },
           status: :forbidden
  end

  def challenge_params
    params.permit(:territory_id)
  end
end
