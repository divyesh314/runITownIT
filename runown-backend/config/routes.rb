Rails.application.routes.draw do
  namespace :api do
    resources :users, only: [:create, :update, :show, :index, :destroy]
    resources :territories, only: [:create, :claim, :index]
    resources :runs, only: [:start, :verify, :index]
    resources :challenges, only: [:create, :accept, :index]
  end
end