class ApplicationController < ActionController::API
  rescue_from ActiveRecord::RecordNotFound, with: :render_not_found
  rescue_from ActionController::ParameterMissing, with: :render_bad_request

  private

  # Reads `Authorization: Bearer <token>` and finds the matching user.
  # Every endpoint except signup/login requires this - controllers that
  # need a logged-in user call `authenticate_user!`.
  def current_user
    return @current_user if defined?(@current_user)

    token = request.headers['Authorization']&.split('Bearer ')&.last
    @current_user = token.present? ? User.find_by(auth_token: token) : nil
  end

  def authenticate_user!
    render json: { error: 'Not authenticated - log in and send Authorization: Bearer <token>' }, status: :unauthorized unless current_user
  end

  def render_not_found(exception)
    render json: { error: exception.message }, status: :not_found
  end

  def render_bad_request(exception)
    render json: { error: exception.message }, status: :bad_request
  end
end
