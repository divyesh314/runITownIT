Rails.application.routes.draw do
  get '/health', to: proc { [200, {}, ['ok']] }

  namespace :api do
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
