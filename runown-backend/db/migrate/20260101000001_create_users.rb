class CreateUsers < ActiveRecord::Migration[7.1]
  def change
    create_table :users do |t|
      t.string :name, null: false
      t.string :email, null: false, default: ''

      # Devise :database_authenticatable
      t.string :encrypted_password, null: false, default: ''

      # Simple bearer token used by the mobile app / web dashboard to
      # authenticate API requests (see has_secure_token on the User model).
      t.string :auth_token

      t.timestamps
    end

    add_index :users, :email, unique: true
    add_index :users, :auth_token, unique: true
  end
end
