# Placeholder base class - no channels are built on top of this yet, but a
# client can already open a socket at ws://.../cable?token=<auth_token> and
# identify itself, ready for future features like a live "you've been
# challenged!" notification.
class ApplicationCable::Connection < ActionCable::Connection::Base
  identified_by :current_user

  def connect
    self.current_user = find_verified_user
  end

  private

  def find_verified_user
    user = User.find_by(auth_token: request.params[:token])
    user || reject_unauthorized_connection
  end
end
