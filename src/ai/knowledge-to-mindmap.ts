import type { ChapterKnowledge, KnowledgeTopic } from '@/ai/chapter-knowledge';

/**
 * Converts already-extracted chapter knowledge directly into mindmap data - a pure,
 * zero-cost transform with no AI call, since the knowledge tree already has exactly the
 * hierarchy (topics -> subtopics) a mindmap needs. This is the clearest case of the
 * "mother record" paying for itself: the hard work of understanding the chapter and
 * organizing it into a topic tree already happened once during extraction.
 */

export type MindmapNode = {
  name: string;
  definition?: string;
  mechanism?: string;
  examples?: string;
  branches?: MindmapNode[];
};

const MAX_FACTS_IN_EXAMPLES = 3; // keep node detail text mindmap-appropriate (brief), not exhaustive

function topicToMindmapNode(topic: KnowledgeTopic): MindmapNode {
  const definition = topic.definitions?.length ? topic.definitions.join(' ') : topic.summary;
  const mechanism = topic.mechanisms?.length ? topic.mechanisms.join(' ') : undefined;
  const examples = topic.facts?.length
    ? topic.facts.slice(0, MAX_FACTS_IN_EXAMPLES).map((f) => f.fact).join(' ')
    : undefined;

  return {
    name: topic.name,
    definition,
    mechanism,
    examples,
    branches: topic.subtopics?.length ? topic.subtopics.map(topicToMindmapNode) : undefined,
  };
}

export function knowledgeToMindmapData(knowledge: ChapterKnowledge): { centralTopic: string; branches: MindmapNode[] } {
  return {
    centralTopic: knowledge.centralTopic,
    branches: knowledge.topics.map(topicToMindmapNode),
  };
}
