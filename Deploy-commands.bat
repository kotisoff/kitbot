@echo off
echo Deploy commands.
set /p guildid=GuildID:
node deploy-commands %guildid%
pause