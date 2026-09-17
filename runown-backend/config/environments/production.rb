Rails.application.configure do
  config.cache_classes = true
  config.eager_load = true
  config.consider_all_requests_local = false

  # This repo never generated config/credentials.yml.enc (no master.key was
  # ever committed, correctly - see .gitignore), so Rails has no encrypted
  # secret_key_base to fall back on. Without this line, first boot in
  # production would raise `ArgumentError: Missing `secret_key_base`` before
  # a single request is served. Set SECRET_KEY_BASE as a platform secret -
  # generate one locally with `ruby -rsecurerandom -e "puts SecureRandom.hex(64)"`
  # (no bundle/gems required to run that). See CHALLENGES.md.
  config.require_master_key = false
  config.secret_key_base = ENV.fetch('SECRET_KEY_BASE')

  config.log_level = :info
  config.log_tags = [:request_id]

  config.force_ssl = ENV.fetch('RUNOWN_FORCE_SSL', 'true') == 'true'

  # Rejects requests whose Host header isn't one of ours (protects against
  # Host header injection / cache poisoning). Comma-separated in
  # RUNOWN_ALLOWED_HOSTS, e.g. "runown-backend.onrender.com,api.runown.app".
  # Left unset = no restriction, so a first deploy doesn't 500 before this
  # gets configured - set it once you know your real host.
  allowed_hosts = ENV.fetch('RUNOWN_ALLOWED_HOSTS', '').split(',').map(&:strip).reject(&:empty?)
  config.hosts.concat(allowed_hosts) if allowed_hosts.any?
  # The platform's own load-balancer health check may not send a Host
  # header that matches, so always let /health through regardless.
  config.host_authorization = { exclude: ->(request) { request.path == '/health' } }

  config.active_support.report_deprecations = false

  logger           = ActiveSupport::Logger.new(STDOUT)
  logger.formatter = config.log_formatter
  config.logger    = ActiveSupport::TaggedLogging.new(logger)
end
