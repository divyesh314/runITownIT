require_relative 'boot'

require 'rails'
# Pick only the frameworks an API-only backend needs. action_mailer is
# included even though this app never actually sends email (no :confirmable
# or :recoverable on the User model - see app/models/user.rb) - Devise's
# Mailer class inherits from ActionMailer::Base, and without this require
# that class never gets properly defined. That's harmless in development
# (Rails doesn't eager-load there), but production eager-loads everything
# at boot, so it surfaces as "expected file .../devise/mailer.rb to define
# constant Devise::Mailer, but didn't" the moment this runs on a real
# server. See CHALLENGES.md.
require 'active_model/railtie'
require 'active_job/railtie'
require 'active_record/railtie'
require 'action_controller/railtie'
require 'action_mailer/railtie'
require 'action_cable/engine'

Bundler.require(*Rails.groups)

module RunownBackend
  class Application < Rails::Application
    config.load_defaults 7.1

    # This is an API-only application: no views, no cookie-based sessions,
    # no asset pipeline. The mobile app and the web dashboard are the UIs.
    config.api_only = true

    # Territory GPS coordinates and run paths are stored as plain floats/JSON
    # (see db/migrate) rather than PostGIS types, so no extra Postgres
    # extensions are required to run this app locally.
  end
end
