class TerritoriesController < ApplicationController
  def claim
    lat = params[:lat].to_f  # Grab lat from request (app sends it)
    lng = params[:lng].to_f  # Grab lng
    user_id = params[:user_id]  # From login (fake for now; auth later)
    
    user = User.find_by(id: user_id)  # Find owner
    if user.nil?
      render json: { error: 'User not found—log in first!' }, status: 404
      return
    end
    
    @territory = Territory.new(  # New turf object
      name: params[:name],  # e.g., "Park Loop"
      lat: lat,
      lng: lng,
      owner: user  # Assign owner
    )
    
    if @territory.save  # Try save to DB
      render json: { message: 'Turf claimed! You own the streets.', id: @territory.id, lat: lat, lng: lng }
    else
      render json: { error: @territory.errors.full_messages }, status: 400  # Bad data? List why
    end
  end
end