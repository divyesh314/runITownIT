class RunsController < ApplicationController
  before_action :authenticate_user!

  # GET /api/runs - the current user's run history
  def index
    render json: current_user.runs.order(created_at: :desc)
  end

  # GET /api/runs/:id
  def show
    render json: current_user.runs.find(params[:id])
  end

  # POST /api/runs/start - call this the moment someone taps "Start Run"
  def start
    run = current_user.runs.new(run_params.merge(started_at: Time.current))
    if run.save
      render json: run, status: :created
    else
      render json: { errors: run.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # POST /api/runs/:id/verify - call this when the run ends, with the full
  # recorded GPS trace. Confirms it actually passed through the territory
  # and, if so, hands the runner ownership (see Run#validate_run).
  def verify
    run = current_user.runs.find(params[:id])

    if run.validate_run(gps_data_params, duration: params[:duration])
      render json: { message: 'Run verified - territory claimed!', run: run }
    else
      render json: { error: 'This run did not pass through its territory, so nothing was claimed', run: run },
             status: :unprocessable_entity
    end
  end

  private

  def run_params
    params.permit(:territory_id, :duration)
  end

  def gps_data_params
    params.permit(gps_data: %i[lat lng])[:gps_data]
  end
end
