Devise.setup do |config|
  require 'devise/orm/active_record'

  # Used to send emails / generate tokens. Not used to send real mail today
  # (no ActionMailer SMTP is configured), but Devise requires a mailer
  # sender to be set even if password-reset emails are added later.
  config.mailer_sender = 'no-reply@runown.app'

  # This app is an API: there is no HTML sign-in form, so skip Devise's
  # session/flash-message plumbing.
  config.navigational_formats = []

  config.stretches = Rails.env.test? ? 1 : 12
  config.password_length = 8..128
  config.email_regexp = /\A[^@\s]+@[^@\s]+\z/

  config.sign_out_via = :delete
end
