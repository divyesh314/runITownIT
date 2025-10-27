class ChallengesController < ApplicationController
  # GET /api/challenges
  def index
    @challenges = Challenge.all
    render json: @challenges
  end

  # POST /api/challenges
  def create
    @challenge = Challenge.new(challenge_params)
    if @challenge.save
      render json: @challenge, status: :created
    else
      render json: @challenge.errors, status: :unprocessable_entity
    end
  end

  # POST /api/challenges/:id/accept
  def accept
    @challenge = Challenge.find(params[:id])
    @challenge.status = 'accepted'
    if @challenge.save
      render json: @challenge
    else
      render json: @challenge.errors, status: :unprocessable_entity
    end
  end

  private

  def challenge_params
    params.require(:challenge).permit(:challenger_id, :territory_id)
  end
end