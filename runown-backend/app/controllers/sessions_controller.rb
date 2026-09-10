# Minimal API login: trade an email/password for a bearer token. There is no
# HTML sign-in page here on purpose (config.api_only = true) - the mobile
# app and web dashboard both call this endpoint directly.
class SessionsController < ApplicationController
  before_action :authenticate_user!, only: :destroy

  def create
    user = User.find_by(email: params[:email]&.downcase)

    if user&.valid_password?(params[:password])
      user.regenerate_auth_token
      render json: { user: user, token: user.auth_token }, status: :ok
    else
      render json: { error: 'Incorrect email or password' }, status: :unauthorized
    end
  end

  def destroy
    current_user.regenerate_auth_token
    head :no_content
  end
end
