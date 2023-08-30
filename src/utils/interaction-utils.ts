import {
    ApplicationCommandOptionChoiceData,
    AutocompleteInteraction,
    CommandInteraction,
    DiscordAPIError,
    RESTJSONErrorCodes as DiscordApiErrors,
    EmbedBuilder,
    InteractionReplyOptions,
    InteractionResponse,
    InteractionUpdateOptions,
    Message,
    MessageComponentInteraction,
    ModalSubmitInteraction,
    WebhookMessageEditOptions,
} from 'discord.js';

const IGNORED_ERRORS = [
    DiscordApiErrors.UnknownMessage,
    DiscordApiErrors.UnknownChannel,
    DiscordApiErrors.UnknownGuild,
    DiscordApiErrors.UnknownUser,
    DiscordApiErrors.UnknownInteraction,
    DiscordApiErrors.CannotSendMessagesToThisUser, // User blocked bot or DM disabled
    DiscordApiErrors.ReactionWasBlocked, // User blocked bot or DM disabled
    DiscordApiErrors.MaximumActiveThreads,
];

export class InteractionUtils {
    public static async deferReply(
        intr: CommandInteraction | MessageComponentInteraction | ModalSubmitInteraction,
        hidden: boolean = false
    ): Promise<InteractionResponse> {
        try {
            return await intr.deferReply({
                ephemeral: hidden,
            });
        } catch (error) {
            if (
                error instanceof DiscordAPIError &&
                typeof error.code == 'number' &&
                IGNORED_ERRORS.includes(error.code)
            ) {
                return;
            } else {
                throw error;
            }
        }
    }

    public static async deferUpdate(
        intr: MessageComponentInteraction | ModalSubmitInteraction
    ): Promise<InteractionResponse> {
        try {
            return await intr.deferUpdate();
        } catch (error) {
            if (
                error instanceof DiscordAPIError &&
                typeof error.code == 'number' &&
                IGNORED_ERRORS.includes(error.code)
            ) {
                return;
            } else {
                throw error;
            }
        }
    }

    public static async send(
        intr: CommandInteraction | MessageComponentInteraction | ModalSubmitInteraction,
        content: string | EmbedBuilder | InteractionReplyOptions,
        hidden: boolean = false
    ): Promise<Message> {
        console.log('send function called with parameters:', intr, content, hidden);
        try {
            let options: InteractionReplyOptions =
                typeof content === 'string'
                    ? { content }
                    : content instanceof EmbedBuilder
                    ? { embeds: [content] }
                    : content;
            console.log('options:', options);
            if (intr.deferred || intr.replied) {
                return await intr.followUp({
                    ...options,
                    ephemeral: hidden,
                });
            } else {
                console.log('intr.deferred or intr.replied is false');
                return await intr.reply({
                    ...options,
                    ephemeral: false,
                    fetchReply: true,
                });
            }
        } catch (error) {
            console.log('error caught:', error);
            if (
                error instanceof DiscordAPIError &&
                typeof error.code == 'number' &&
                IGNORED_ERRORS.includes(error.code)
            ) {
                console.log('error is an instance of DiscordAPIError and its code is in IGNORED_ERRORS');
                return;
            } else {
                console.log('error is not an instance of DiscordAPIError or its code is not in IGNORED_ERRORS');
                throw error;
            }
        }
    }

    public static async respond(
        intr: AutocompleteInteraction,
        choices: ApplicationCommandOptionChoiceData[] = []
    ): Promise<void> {
        try {
            return await intr.respond(choices);
        } catch (error) {
            if (
                error instanceof DiscordAPIError &&
                typeof error.code == 'number' &&
                IGNORED_ERRORS.includes(error.code)
            ) {
                return;
            } else {
                throw error;
            }
        }
    }

    public static async editReply(
        intr: CommandInteraction | MessageComponentInteraction | ModalSubmitInteraction,
        content: string | EmbedBuilder | WebhookMessageEditOptions
    ): Promise<Message> {
        try {
            let options: WebhookMessageEditOptions =
                typeof content === 'string'
                    ? { content }
                    : content instanceof EmbedBuilder
                    ? { embeds: [content] }
                    : content;
            return await intr.editReply(options);
        } catch (error) {
            if (
                error instanceof DiscordAPIError &&
                typeof error.code == 'number' &&
                IGNORED_ERRORS.includes(error.code)
            ) {
                return;
            } else {
                throw error;
            }
        }
    }

    public static async update(
        intr: MessageComponentInteraction,
        content: string | EmbedBuilder | InteractionUpdateOptions
    ): Promise<Message> {
        try {
            let options: InteractionUpdateOptions =
                typeof content === 'string'
                    ? { content }
                    : content instanceof EmbedBuilder
                    ? { embeds: [content] }
                    : content;
            return await intr.update({
                ...options,
                fetchReply: true,
            });
        } catch (error) {
            if (
                error instanceof DiscordAPIError &&
                typeof error.code == 'number' &&
                IGNORED_ERRORS.includes(error.code)
            ) {
                return;
            } else {
                throw error;
            }
        }
    }
}
