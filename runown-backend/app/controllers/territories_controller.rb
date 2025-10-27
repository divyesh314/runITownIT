class TerritoriesController < ApplicationController
  # GET /api/territories
  def index
    territories = Territory.all
    render json: territories
  end

  # POST /api/territories
  def create
    territory = Territory.new(territory_params)
    if territory.save
      render json: territory, status: :created
    else
      render json: territory.errors, status: :unprocessable_entity
    end
  end

  # POST /api/claim-territory
  def claim
    territory = Territory.find(params[:id])
    if territory.update(owner_id: current_user.id)
      render json: territory, status: :ok
    else
      render json: territory.errors, status: :unprocessable_entity
    end
  end

  private

  def territory_params
    params.require(:territory).permit(:name, :latitude, :longitude)
  end
end