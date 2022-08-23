# Minecraft Terminal

Minecraft Terminal is a lightweight CLI app that allows you to play minecraft in the terminal.

[![Codacy Badge](https://app.codacy.com/project/badge/Grade/5d815c7321aa468fa37b3f3509757b6c)](https://www.codacy.com/gh/MC-Terminal/minecraft-terminal/dashboard?utm_source=github.com&utm_medium=referral&utm_content=MC-Terminal/minecraft-terminal&utm_campaign=Badge_Grade)

This README is a work in progress:

- [X] [Downloads](#downloads)
- [ ] [Usage](#usage)
  - [X] [Command-line usage](#command-line-usage)
  - [ ] [Internal commands (10%)](#internal-commands)
  - [X] [Scripts](#scripts)
  - [X] [Hotkeys](#hotkeys)
  - [X] [Remote control (RCON)](#remote-control)
  - [ ] [Configuration](#configuration)
    - [X] [Credentials](#credentials)
    - [ ] [Configuration](#configuration-1)
    - [ ] Physics

## Downloads

### Install with npm (Recommended)

```bash
$ npm i -g mc-term
$ mc-term
```

Alternatively you can clone the git repo.

### Clone git repo

```bash
$ git clone https://github.com/MC-Terminal/minecraft-terminal.git
$ cd minecraft-terminal
$ npm install
$ node .
```

## Usage

### First launch

You need to setup the configuration files before actually using the program.

To do this you must specify the configuration directory path:

```
$ mc-term -scp /path/to/config/dir
```

Then you must generate the default configuration files in that same directory:

```
$ mc-term -gc /path/to/config/dir
```

Finally check if you've set everything correctly:

```
$ ls /path/to/config/dir
config.json  credentials.json  physics.json
```

### Command-line usage

```
Usage:
   --no-conf, -nc           Do not use the configuration file.
   --no-cred, -ns           Do not use the credentials file.
   --set-conf-path, -scp    Set the config folder path
   --get-conf-path, -gcp    Get the config folder path
   --gen-conf, -gc          Generate configuration files
   --cred, -c               <Auth> <Username> <Password> <Version> <Server>
                            Override credentials from CLI arguments.
   --help, -h               Show this help message.
   --version, -v            Show version information.
```

You can use '!' in --cred to leave it empty.

#### Examples and further explanations:

Use the the default settings overriding the username:

```
$ mc-term --c ! Player456 '' ! !
Password :
```

* '!' will use the login options specified in cred.json if no options are set it will use defaults
* '' will prompt

Do not use the credentials file cred.json:

```
$ mc-term  --no-cred
[WARN] Not using "credentials.json" because of --no-cred
Auth :
Login :
Password :
Server :
Version :
```

Do not use the configuration file config.json:

```
$ mc-term --no-conf
[WARN] Not using "config.json" because of --no-conf
Auth :
Login :
Password :
Server :
Version :
```

Set the configuration files path and exit:

```
$ mc-term --set-conf-path /home/user/.config/mc-term
```

Print the configuration files location and exit:

```
$ mc-term --get-conf-path
Path to config: /home/user/.config/mc-term
```

Generate default configuration files in the specified location:

```
$ mc-term --gen-conf /home/user/.config/mc-term
```

### Internal commands

Disconnect from the server:

```
>.exit
$
```

Reconnect to server:

```
>.reco
[INFO] Connected.
>
```

Move the player in blocks:

```
>.move
[INFO] Usage: .move <Direction> <distance?>. Direction = <north|south|east|west> distance > 0
```

Move the player in seconds:

```
>.forcemove
[INFO] Usage: .forcemove <Dircetion:up|forward|back|left|right> <Time:Seconds>
```

Follow a player:

```
>.follow
[INFO] Usage: .follow <Player> <Range>. Range > 1
```

Stop following a player:

```
>.unfollow
[INFO] Not following anyone
```

Attack a player:

```
>.attack
[INFO] Usage: .attack <Player> <CPS> <MaxReach> <MinReach>. MaxReach > MinReach (Duh), CPS > 0
```

Stop attacking a player:

```
>.stopattack
[INFO] Not attacking anyone
```

Send a message in chat:

```
>.send
[INFO] Usage: .send <Message>
```
* You can also send a message by directly typing it chat `.send` is really only meant for scripts

Inventory management:

```
[INFO] Connected.
>.inventory
[INFO] Usage: .inventory <ID: inventory|container|0|1> <Action?: click|move|drop|dropall> <Arg1?> <Arg2?>
```

Use an item:

```
[INFO] Connected.
>.useitem
[INFO] Used an item for 0.1 seconds
```

* You can specify for how long you should use an item. By default it's 0.1 seconds

Change the selected hotbar slot:

```
[INFO] Connected.
>.changeslot
[INFO] Usage: .changeslot <Slot>. -1 < Slot < 9
```

Run a script:

```
[INFO] Connected.
>.script
[INFO] Usage: .script <Path> <Condition>
```

* 'Condition' is not used yet. i.e. It's useless


Look at a player:

```
[INFO] Connected.
>.lookat
[INFO] Usage: .lookat <Player> <MaxReach> <MinReach> <Force?:yes|y|no|n>. MaxReach > MinReach (duh)
```

Stop looking at a player:

```
[INFO] Connected.
>.stoplook
[INFO] Not looking at anyone
```

Look in a specific direction:

```
[INFO] Connected.
>.look
[INFO] Usage: .look <Direction?:north|south|east|west> <Yaw?> <Pitch?>
```

Set the control state of the player:

```
[INFO] Connected.
>.control
[INFO] Usage: .control <Control: forward|back|left|right|jump|sneak> <State: true, false>
```

Show a list of all connected players on the server (and their ping):

```
[INFO] Connected.
>.list
[INFO] Player list: Player123 [50] AnotherPlayer [121]
```

Show a list of all commands:

```
[INFO] Connected.
>.help
[INFO] .exit           Exits the program
       .reco           Reconnects to server
       .move           Move in a certain direction in blocks
       .forcemove      Move in a certain direction in seconds
       .control        Set a control state
       .follow         Follows a player
       .unfollow       Stops following
       .attack         Attacks a player
       .stopattack     Stops attacking
       .lookat         Look at a player
       .stoplook       Stops looking
       .look           Look in a certain direction
       .send           Sends a message
       .inventory      Inventory management
       .useitem        Use a held item
       .changeslot     Change held hotbar slot
       .script         Run a script
       .list           List players connected to the server and their ping
       .help           Shows this help message

```
### Scripts

A script is a plain text file which contains a series of commands. These commands are the same commands we would normally type in chat (such as **move** or **attack**).

Note:

* You don't need to type '.' before a command in a script and you cannot send a message by typing the message directly.
* You can comment out a line by typing '#' at the start of the line.

Example:

```bash
# Works
send I just sent a message in chat!

# Doesn't work
.send I just send a message in chat!

# Doesn't work
I just send a message in chat!
```

#### Script only commands

Waits for a specific amount of seconds before running the next command:

### Running a script

```
[INFO] Connected.
>.script /path/to the/script
[INFO] Connected.
```

### Hotkeys


| Hotkey        | What it does                                |
| :-------------- | :-------------------------------------------- |
| CTRL-B        | Move back one character without deleting    |
| CTRL-F        | Move forward one character without deleting |
| BACKSPACE     | Delete one character backwards              |
| DEL           | Delete one character forwards               |
| ESC-B         | Move back one word without deleting         |
| ESC-F         | Move forward one word without deleting      |
| ALT-BACKSPACE | Delete or “kill” one word backwards       |
| ESC-D         | Delete or “kill” one word forwards        |
| CTRL-A        | Move cursor to the beginning of the line    |
| CTRL-E        | Move cursor to the end of the line          |
| CTRL-U        | Kill forward to the beginning of a line     |
| CTRL-K        | Kill forward to the end of a line           |
| CTRL-L        | Clears the screen                           |

### Remote control

For now you can send a message that starts with '!#' and the bot will repeat everything that comes after '!#'.

```
[INFO] Connected.
<AnotherPlayer> !#Hello
[RCON] Hello
<Player456> Hello
<AnotherPlayer> !#/gamemode creative
[RCON] /gamemode creative
Set own gamemode to creative.
<AnotherPlayer> !#.exit
[RCON] .exit
```

### Configuration

Go to the configuration directory:

```bash
$ Path to config: /path/to/config/dir
$ cd /path/to/config/dir
$ ls
config.json  credentials.json  physics.json
```

Edit the files.

### Credentials

The 'credentials.json' file.

#### Auth

The auth to use when logging in (microsoft/mojang).

#### Login

Your Minecraft or Microsoft username/email.

#### Password

Your Minecraft or Microsoft password.

#### Server

The server IP (e.g. localhost:48621, lunar.gg).

#### Version

The Minecraft version.

Currently only supports [1.8-latest]

#### Configuration

The 'config.json' file.

##### canDig

* true, false

Should the player be able to dig or not.

##### digCost

* Number

How much you should discourage the follow bot to dig blocks

##### placeCost

* Number

How much you should discourage the follow bot to place blocks

##### liquidCost

* Number

How much you should discourage the follow bot to go through liquids

##### entityCost

* Number

How much you should discourage the follow bot to go through entities

##### bot.physicsEnabled

* true, false

Should the bot use physics (e.g. knockback, gravity).

Disabling this will get you banned on most servers.

##### bot.settings

###### bot.settings.chat

* Enabled, Disabled, CommandOnly

###### bot.settings.colorsEnabled

* true, false

If set to false the bot tells the server to not send colored messages.

It's up to the server to decide if they should respect this option or not.

###### bot.settings.viewDistance

* tiny, short, normal, far

The render distance.

###### bot.settings.mainHand

* left, right

Specify which hand is the main hand.

###### bot.settings.enableTextFiltering

* true, false

###### bot.settings.enableServerListing

* true, false

Whether or not the player would show up in server listings.

##### bot.settings.skinParts

###### bot.settings.skinParts.showCape

* true, false

###### bot.settings.skinParts.showJacket

* true, false

###### bot.settings.skinParts.showLeftSleeve

* true, false

###### bot.settings.skinParts.showRightSleeve

* true, false

###### bot.settings.skinParts.showLeftPants

* true, false

###### bot.settings.skinParts.showRightPants

* true, false

###### bot.settings.skinParts.showHat

* true, false

##### bot.settings.pathfinder

###### bot.settings.pathfinder.thinkTimeout

* Number

###### bot.settings.pathfinder.tickTimeout

* Number

###### bot.settings.pathfinder.searchRadius

* Number

###### bot.settings.pathfinder.enablePathShortcut

* true, false

###### bot.settings.pathfinder.LOSWhenPlacingBlocks

* true, false