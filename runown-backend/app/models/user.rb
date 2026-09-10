class User < ApplicationRecord
  # :recoverable/:rememberable are left out on purpose: there is no email
  # sending set up and no browser session to "remember" in an API-only app.
  devise :database_authenticatable, :registerable, :validatable

  # Generates a random, unique `auth_token` the first time a user is saved.
  # The mobile app / web dashboard send this back as
  # `Authorization: Bearer <auth_token>` on every request after login.
  has_secure_token :auth_token

  validates :name, presence: true

  has_many :runs, dependent: :destroy
  has_many :challenges, foreign_key: :challenger_id, inverse_of: :challenger, dependent: :destroy
  has_many :territories, foreign_key: :owner_id, inverse_of: :owner, dependent: :nullify

  def as_json(options = {})
    super(options.merge(except: [:encrypted_password, :auth_token, *options[:except]]))
  end
end
