Rails.application.configure do
  config.cache_classes = true
  config.eager_load = true
  config.consider_all_requests_local = false

  config.log_level = :info
  config.log_tags = [:request_id]

  config.force_ssl = ENV.fetch('RUNOWN_FORCE_SSL', 'true') == 'true'

  config.active_support.report_deprecations = false

  logger           = ActiveSupport::Logger.new(STDOUT)
  logger.formatter = config.log_formatter
  config.logger    = ActiveSupport::TaggedLogging.new(logger)
end
