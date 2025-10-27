class UsersController < ApplicationController
  # POST /api/users
  def create
    user = User.new(user_params)
    if user.save
      render json: user, status: :created
    else
      render json: user.errors, status: :unprocessable_entity
    end
  end

  # PATCH/PUT /api/users/:id
  def update
    user = User.find(params[:id])
    if user.update(user_params)
      render json: user
    else
      render json: user.errors, status: :unprocessable_entity
    end
  end

  # GET /api/users/:id
  def show
    user = User.find(params[:id])
    render json: user
  end

  private

  def user_params
    params.require(:user).permit(:name, :email, :password)
  end
end