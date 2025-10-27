class RunsController < ApplicationController
  # GET /api/runs
  def index
    @runs = Run.all
    render json: @runs
  end

  # POST /api/runs/start
  def start
    @run = Run.new(run_params)
    if @run.save
      render json: @run, status: :created
    else
      render json: @run.errors, status: :unprocessable_entity
    end
  end

  # POST /api/runs/verify
  def verify
    @run = Run.find(params[:id])
    if @run.verify_run(params[:gps_data])
      render json: { message: 'Run verified successfully' }, status: :ok
    else
      render json: { error: 'Verification failed' }, status: :unprocessable_entity
    end
  end

  private

  def run_params
    params.require(:run).permit(:user_id, :territory_id, :duration)
  end
end