import { InteractionHandler, InteractionHandlerTypes } from "@sapphire/framework";
import { AutocompleteInteraction } from "discord.js";
import ModelManager from "../modules/ai/ModelManager";

export class LoadModelAutocompleteHandler extends InteractionHandler {
  public constructor(ctx: InteractionHandler.LoaderContext, options: InteractionHandler.Options) {
    super(ctx, {
      ...options,
      interactionHandlerType: InteractionHandlerTypes.Autocomplete
    });
  }

  public override async run(interaction: AutocompleteInteraction, result: InteractionHandler.ParseResult<this>) {
    return interaction.respond(result);
  }

  public override async parse(interaction: AutocompleteInteraction) {
    // Only run this interaction for the command with ID '1000802763292020737'
    if (interaction.commandName != "ai") return this.none();

    // Get the focussed (current) option
    const focusedOption = interaction.options.getFocused(true);

    // Ensure that the option name is one that can be autocompleted, or return none if not.
    switch (focusedOption.name) {
      case "model": {
        const results = await ModelManager.listModels();
        // Search your API or similar. This is example code!
        const searchResult = results.filter((m) => m.displayName.startsWith(focusedOption.value));

        // Map the search results to the structure required for Autocomplete
        return this.some(
          searchResult.map((match) => ({
            name: `${match.displayName} ${match.quantization ? `(${match.quantization.name})` : ""}`,
            value: match.modelKey
          }))
        );
      }
      case "baseurl": {
        const results = Object.keys(ModelManager.config.servers);
        const searchResult = results.filter((o) => o.startsWith(focusedOption.value));

        return this.some(
          searchResult.map((m) => ({ name: m.slice(0, 1).toUpperCase() + m.slice(1), value: "saved:" + m }))
        );
      }
      default:
        return this.none();
    }
  }
}
