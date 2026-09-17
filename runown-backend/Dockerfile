# Matches the Gemfile's `ruby '3.3.6'` - the old `ruby:3.0` base image here
# was a full major version behind (and 3.0 is past its own EOL/security
# support window), so `bundle install` would either refuse to run or quietly
# resolve gems against the wrong Ruby version. See CHALLENGES.md.
FROM ruby:3.3.6-slim

# Native libs bundler/pg/puma need to build their C extensions, plus
# postgresql-client for `rails db:*` tasks against a remote Postgres.
RUN apt-get update -qq && apt-get install -y --no-install-recommends \
      build-essential libpq-dev libyaml-dev git curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

ENV RAILS_ENV=production \
    RACK_ENV=production \
    BUNDLE_WITHOUT=development:test \
    RAILS_LOG_TO_STDOUT=true \
    RAILS_SERVE_STATIC_FILES=true

# Gemfile.lock has to exist and be committed before this build will work -
# run `bundle install` locally first (see README). Copying only these two
# files first, before the rest of the app, means Docker can cache this
# layer and skip re-installing gems on every code change.
COPY Gemfile Gemfile.lock ./
RUN bundle install --jobs 4 --retry 3

COPY . .

# No `assets:precompile` here on purpose: this is an API-only Rails app
# (config.api_only = true, no Sprockets/asset pipeline gem in the Gemfile)
# - that task doesn't exist in this app and the original Dockerfile's call
# to it would fail the build outright. See CHALLENGES.md.

EXPOSE 3000

# Runs migrations (idempotent - creates the DB if missing, migrates if not)
# before starting the server, so a fresh deploy doesn't boot against an
# empty/out-of-date schema.
CMD ["sh", "-c", "bundle exec rails db:prepare && bundle exec puma -C config/puma.rb"]
