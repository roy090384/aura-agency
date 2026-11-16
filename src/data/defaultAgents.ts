import { AgentProfile } from '../types/player';

export const DEFAULT_AGENTS: AgentProfile[] = [
  {
    id: 'roy-shpitalnik',
    name: 'Roy Shpitalnik',
    role: 'Senior Licensed Agent',
    phone: '',
    email: ''
  },
  {
    id: 'aviv-kamara',
    name: 'Aviv Kamara',
    role: 'Licensed Football Agent',
    phone: '',
    email: ''
  }
];

export function findAgentProfile(
  agents: AgentProfile[],
  assignedAgent?: string
): AgentProfile | undefined {
  if (!assignedAgent) return undefined;
  const normalized = assignedAgent.trim().toLowerCase();
  return agents.find(
    a => a.id.toLowerCase() === normalized || a.name.trim().toLowerCase() === normalized
  );
}
