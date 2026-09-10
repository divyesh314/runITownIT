class CreateChallenges < ActiveRecord::Migration[7.1]
  def change
    create_table :challenges do |t|
      t.references :challenger, foreign_key: { to_table: :users }, null: false
      t.references :territory, foreign_key: true, null: false
      t.references :winner, foreign_key: { to_table: :users }, null: true

      # 0 pending, 1 accepted, 2 completed, 3 declined (see Challenge model)
      t.integer :status, null: false, default: 0

      t.timestamps
    end
  end
end
