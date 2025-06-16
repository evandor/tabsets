import AiGateway from 'app/src-bex/ai/AiGateway'
import XenovaAiGateway from 'app/src-bex/ai/XenovaAiGateway'

export function useAiService() {
  const xenova: AiGateway = XenovaAiGateway

  return {
    xenova,
  }
}
