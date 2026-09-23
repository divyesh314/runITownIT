Rails.application.routes.draw do
  get '/health', to: proc { [200, {}, ['ok']] }

  # `scope path: 'api'` (not `namespace :api`) on purpose: `namespace` adds
  # BOTH a /api URL prefix AND a controller module prefix, so it would
  # route POST /api/login to Api::SessionsController#create - a class that
  # has never existed in this app (every controller below lives directly
  # in app/controllers/, e.g. SessionsController, not app/controllers/api/).
  # `scope path:` adds only the URL prefix, routing to the plain top-level
  # controllers that actually exist. This was broken since the routes were
  # first written and only surfaced once real requests hit a real server -
  # every prior check was a `ruby -c` syntax check, which can't catch a
  # missing constant since that only gets resolved at request time.
  scope path: 'api' do
    post 'signup', to: 'users#create'
    post 'login', to: 'sessions#create'
    delete 'logout', to: 'sessions#destroy'

    resources :users, only: %i[show update]

    get 'leaderboard', to: 'leaderboard#index'

    resources :territories, only: %i[index show create] do
      collection do
        post :claim
      end
    end

    resources :runs, only: %i[index show create] do
      collection do
        post :start
      end
      member do
        post :verify
      end
    end

    resources :challenges, only: %i[index show create] do
      member do
        post :accept
        post :decline
        post :complete
      end
    end
  end
end
