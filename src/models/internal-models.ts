import { Locale, Channel, BaseMessageOptions } from 'discord.js';
import { CommandInteractionOptionResolver } from 'discord.js';

// This class is used to store and pass data along in events
export class EventData {
    // TODO: Add any data you want to store
    constructor(
        // Event language
        public lang: Locale,
        // Guild language
        public langGuild: Locale,
        // Interaction arguments
        public args?: Omit<CommandInteractionOptionResolver, 'getMessage' | 'getFocused'>,
        // Channel to send the message
        public channel?: Channel,
        // Message options for reply
        public messageOptions?: BaseMessageOptions
    ) {}
}
