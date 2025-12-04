import { Character } from "@/lib/core/character";
import { CharacterDialogue } from "@/lib/core/character-dialogue";
import { LocalCharacterDialogueOperations } from "@/lib/data/roleplay/character-dialogue-operation";
import { LocalCharacterRecordOperations } from "@/lib/data/roleplay/character-record-operation";
import { adaptText } from "@/lib/adapter/tagReplacer";
import { RegexProcessor } from "@/lib/core/regex-processor";

interface InitCharacterDialogueOptions {
  username?: string;
  characterId: string;
  language?: "zh" | "en";
  modelName: string;
  baseUrl: string;
  apiKey: string;
  llmType: "openai" | "ollama" | "gemini";
}

export async function initCharacterDialogue(options: InitCharacterDialogueOptions) {
  const { username, characterId, language = "zh", modelName, baseUrl, apiKey, llmType } = options;

  if (!characterId) {
    throw new Error("Missing required parameters");
  }

  try {
    const characterRecord = await LocalCharacterRecordOperations.getCharacterById(characterId);
    if (!characterRecord) {
      throw new Error("Character not found");
    }

    const character = new Character(characterRecord);
    const dialogue = new CharacterDialogue(character);

    await dialogue.initialize({
      modelName,
      baseUrl,
      apiKey,
      llmType,
      language,
    });

    const firstAssistantMessage = await dialogue.getFirstMessage();
    let dialogueTree = await LocalCharacterDialogueOperations.getDialogueTreeById(characterId);

    if (!dialogueTree) {
      dialogueTree = await LocalCharacterDialogueOperations.createDialogueTree(characterId);
    }

    const openingMessages: { id: string; content: string }[] = [];
    if (firstAssistantMessage) {
      const messagesToProcess = [...firstAssistantMessage];
      let firstProcessedMessage = "";

      for (let index = 0; index < messagesToProcess.length; index++) {
        const message = messagesToProcess[index];
        const adaptedMessage = adaptText(message, language, username);

        const regexResult = await RegexProcessor.processFullContext(
          adaptedMessage, 
          { 
            ownerId: characterId, 
          },
        );

        const processedMessage = regexResult.replacedText;

        const nodeId = await LocalCharacterDialogueOperations.addNodeToDialogueTree(
          characterId,
          "root",
          "",
          adaptedMessage,
          adaptedMessage,
          "",
          {
            nextPrompts: [],
            regexResult: processedMessage,
            compressedContent: "",
          },
          undefined,
        );

        if (index === 0) {
          firstProcessedMessage = processedMessage;
        }

        openingMessages.push({
          id: nodeId,
          content: processedMessage,
        });
      }

      const activeOpeningId = openingMessages[0]?.id || "";
      if (activeOpeningId) {
        await LocalCharacterDialogueOperations.switchBranch(characterId, activeOpeningId);
      }

      if (openingMessages.length > 0) {
        return {
          success: true,
          characterId,
          firstMessage: firstProcessedMessage,
          nodeId: activeOpeningId,
          openingMessages,
        };
      }
    }

    throw new Error("No assistant message generated");
  } catch (error: any) {
    console.error("Failed to initialize character dialogue:", error);
    throw new Error(`Failed to initialize dialogue: ${error.message}`);
  }
}
