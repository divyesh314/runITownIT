class UsersController < ApplicationController
  before_action :authenticate_user!, only: %i[show update]

  # POST /api/signup
  def create
    user = User.new(user_params)
    if user.save
      render json: { user: user, token: user.auth_token }, status: :created
    else
      render json: { errors: user.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # GET /api/users/:id
  # Your own record comes back in full (still minus password/token - see
  # User#as_json). Anyone else's is trimmed to what's actually public
  # elsewhere in the app (their name and territory count already show up on
  # the leaderboard and on territories they own) - their email is not
  # something every other logged-in user should be able to look up by ID.
  def show
    user = User.find(params[:id])

    if current_user.id == user.id
      render json: user
    else
      render json: { id: user.id, name: user.name, territories_count: user.territories.count }
    end
  end

  # PATCH/PUT /api/users/:id - you can only ever edit your own profile
  def update
    return render json: { error: 'You can only update your own profile' }, status: :forbidden unless
      current_user.id.to_s == params[:id].to_s

    if current_user.update(user_params.except(:password).compact_blank)
      render json: current_user
    else
      render json: { errors: current_user.errors.full_messages }, status: :unprocessable_entity
    end
  end

  private

  def user_params
    params.permit(:name, :email, :password)
  end
end
