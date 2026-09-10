class CreateTerritories < ActiveRecord::Migration[7.1]
  def change
    create_table :territories do |t|
      t.string :name, null: false
      t.float :lat, null: false
      t.float :lng, null: false
      t.references :owner, foreign_key: { to_table: :users }, null: true
      t.datetime :claimed_at

      t.timestamps
    end

    add_index :territories, %i[lat lng]
  end
end
