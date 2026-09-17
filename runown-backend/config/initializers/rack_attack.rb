# Rate limiting for the two endpoints that matter most: login (credential
# stuffing / brute force) and signup (spam account creation). Nothing else
# in the API needs this - every other endpoint already requires a valid
# bearer token, which is a much stronger gate than an IP-based throttle.
#
# Fails open on purpose: if the cache backend has a hiccup, Rack::Attack
# lets requests through rather than taking the whole API down.
Rails.application.config.middleware.use Rack::Attack

class Rack::Attack
  # Rails.cache defaults to a per-process MemoryStore, which is fine for a
  # single dyno/instance. If this app ever runs multiple instances behind a
  # load balancer, point Rails.cache (and therefore this) at Redis so the
  # throttle counts are shared - otherwise each instance enforces its own
  # limit, which is `limit * instance count` in practice.
  Rack::Attack.cache.store = Rails.cache

  throttle('login/ip', limit: 8, period: 20.seconds) do |req|
    req.ip if req.path == '/api/login' && req.post?
  end

  throttle('login/email', limit: 5, period: 60.seconds) do |req|
    if req.path == '/api/login' && req.post?
      req.params['email'].to_s.downcase.presence
    end
  end

  throttle('signup/ip', limit: 5, period: 60.seconds) do |req|
    req.ip if req.path == '/api/signup' && req.post?
  end

  self.throttled_responder = lambda do |request|
    retry_after = (request.env['rack.attack.match_data'] || {})[:period]
    [
      429,
      { 'Content-Type' => 'application/json', 'Retry-After' => retry_after.to_s },
      [{ error: 'Too many attempts - wait a moment and try again.' }.to_json]
    ]
  end
end
