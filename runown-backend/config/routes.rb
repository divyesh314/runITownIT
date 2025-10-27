Rails.application.routes.draw do
  devise_for :users  # If Devise added; skip if not yet
  post '/api/territories/claim', to: 'territories#claim'  # Your claim hook
  resources :territories, only: []  # Hide full CRUD for API security
end