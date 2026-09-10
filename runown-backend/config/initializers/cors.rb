# Allows the React Native app and the Next.js web dashboard (different
# origins) to call this API. Locked down to specific origins in production
# via RUNOWN_ALLOWED_ORIGINS (comma separated); wide open in development so
# Expo/localhost can hit it without extra setup.
Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    origins Rails.env.production? ? ENV.fetch('RUNOWN_ALLOWED_ORIGINS', '').split(',') : '*'

    resource '/api/*',
      headers: :any,
      methods: %i[get post put patch delete options head]
  end
end
