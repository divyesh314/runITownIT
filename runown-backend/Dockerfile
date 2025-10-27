FROM ruby:3.0

# Set the working directory
WORKDIR /app

# Install dependencies
COPY Gemfile Gemfile.lock ./
RUN bundle install

# Copy the application code
COPY . .

# Precompile assets (if any)
RUN RAILS_ENV=production bundle exec rake assets:precompile

# Expose the port the app runs on
EXPOSE 3000

# Start the Rails server
CMD ["rails", "server", "-b", "0.0.0.0"]