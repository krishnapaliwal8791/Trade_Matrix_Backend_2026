import { AppError } from "../../errors/AppError";
import { teamRepository, TeamDetail } from "./team.repository";

export const teamEngine = {
  async getTeamById(id: string): Promise<TeamDetail> {
    const team = await teamRepository.findById(id);

    if (!team) {
      throw new AppError(404, "Team not found.");
    }

    return team;
  },
};
