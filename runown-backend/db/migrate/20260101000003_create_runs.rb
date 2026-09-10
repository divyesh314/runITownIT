class CreateRuns < ActiveRecord::Migration[7.1]
  def change
    create_table :runs do |t|
      t.references :user, foreign_key: true, null: false
      t.references :territory, foreign_key: true, null: true

      # Minutes the run took, as reported when the run is started/finished.
      t.integer :duration

      # Meters, computed from `path` once the run is verified.
      t.float :distance

      # Array of {lat, lng} points recorded during the run, e.g.
      # [{"lat":40.78,"lng":-73.96}, {"lat":40.781,"lng":-73.961}, ...]
      t.jsonb :path, null: false, default: []

      t.boolean :verified, null: false, default: false
      t.datetime :started_at
      t.datetime :ended_at

      t.timestamps
    end
  end
end
