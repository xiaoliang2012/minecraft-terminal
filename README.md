# Minecraft Terminal

[![Codacy Badge](https://app.codacy.com/project/badge/Grade/5d815c7321aa468fa37b3f3509757b6c)](https://www.codacy.com/gh/MC-Terminal/minecraft-terminal/dashboard?utm_source=github.com&utm_medium=referral&utm_content=MC-Terminal/minecraft-terminal&utm_campaign=Badge_Grade) [![npm package](https://badge.fury.io/js/mc-term.svg)](https://www.npmjs.com/package/mc-term) [![npm](https://img.shields.io/npm/dw/mc-term)](https://www.npmjs.com/package/mc-term)

Minecraft Terminal is a lightweight CLI app that allows you to play minecraft in the terminal and configure bots with or without programming knowledge.

**Preview:**

<img src="https://raw.githubusercontent.com/MC-Terminal/minecraft-terminal/65c5d507d460ad5d723f584eedfcffa1a963c9fe/docs/assets/preview.svg" height="250"/>

* [Downloads](#downloads)
  * [Install with NPM (Recommended)](#install-with-npm-recommended)
  * [Clone git repo](#clone-git-repo)
* [Usage](#usage)
  * [Command-line usage](#command-line-usage)
  * [Internal commands](#internal-commands)
  * [Plugins](#plugins)
  * [Scripts](#scripts)
  * [Hotkeys](#hotkeys)
  * [Shortcuts](#shortcuts-and-tips)
  * [Remote control (RCON)](#remote-control)
  * [Configuration](#configuration)
    * [Credentials](#credentials)
    * [Configuration](#configuration-1)
    * [Physics](#physics)

## Downloads

### Install with NPM (Recommended)

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

### Command-line usage

```
Usage:
   --no-conf, -nc           Do not use the configuration file.
   --no-cred, -ns           Do not use the credentials file.
   --no-plugins, -np        Do not load plugins specified in plugins file.
   --set-conf-path, -scp    Set the config folder path
   --get-conf-path, -gcp    Get the config folder path
   --cred, -c               <Auth> <Username> <Password> <Version> <Server>
                            Override credentials from CLI arguments.
   --debug                  Enable debug mode
   --version, -v            Show version information.
   --help, -h               Show this help message.
```

You can use '!' in --cred to leave it empty.

#### Examples and further explanations:

Use the the default settings overriding the username:

```
$ mc-term -c ! Player456 '' ! !
Password :
```

* `!` will use the login options specified in credentials.toml if no options are set it will use defaults
* `''` will prompt

Do not use the credentials file credentials.toml:

```
$ mc-term  --no-cred
[WARN] Not using "credentials.toml" because of --no-cred
Auth :
Login :
Password :
Server :
Version :
```

Do not use the configuration file config.toml:

```
$ mc-term --no-conf
[WARN] Not using "config.toml" because of --no-conf
Auth :
Login :
Password :
Server :
Version :
```

Set the configuration files path and exit:

```
$ mc-term --set-conf-path $HOME/.config/mc-term
```

Print the configuration files location and exit:

```
$ mc-term --get-conf-path
Path to config: $HOME/.config/mc-term
```

### Internal commands

You can use a command by typing `.` before the command.

Commands are case insensitive, so `.exit` and `.EXIT` are the same.

#### Exit

Disconnect from the server:

```
>.exit
[INFO] Exiting
$
```

#### Reco

Reconnect to server:

```
>.reco
[INFO] Connected.
>
```

#### Send

* Message: `String`: Message to send

Send a message in chat:

```
>.send
[INFO] Usage: .send <Message>
```

* You can also send a message by directly typing it chat. `.send` is really only meant for scripts

#### Position

Show current position:

```
>.position
[INFO] Position: -612.09, 4, 1104.99
```

#### Distance

* Point1
  * X: `Number`
  * Y: `Number`
  * Z: `Number`
* Point2
  * X: `Number`
  * Y: `Number`
  * Z: `Number`

Show the distance between two points:

```
>.distance
[INFO] Usage: .distance <X1> <Y1> <Z1> <X2> <Y2> <Z2>
```

#### List

List players connected to the server and their ping:

```
>.list
[INFO] Player list: Player123 [50] AnotherPlayer [121]
```

#### Blocks

* Range: `Number`: Radius for the search
* Count: `Number`: Filter to closest `Count` blocks

Show blocks in a specified radius and filter:

```
>.blocks
[INFO] Usage: .blocks <Range> <Count?>. Range > 0
```

#### Dig

* X: `Number`
* Y: `Number`
* Z: `Number`

Dig a block in a specific location if possible:

```
>.dig
[INFO] Usage: .dig <X> <Y> <Z>
```

#### Stopdig

Stop digging:

```
>.stopdig
[OK] Stopped digging
```

#### Place

* X: `Number`
* Y: `Number`
* Z: `Number`

Place a block in a specific location if possible:

```
>.place
[INFO] Usage: .place <X> <Y> <Z>
```

#### Move

* Direction: `String`: Direction to move to
  * north
  * south
  * east
  * west
* Distance? (optional): `Number` Distance > 0

Move the player in blocks:

```
>.move
[INFO] Usage: .move <Direction> <distance?>. Direction = <north|south|east|west> distance > 0
```

#### MoveTo

* X: `Number`
* Z: `Number`

Move to specific coordinates (Y is variable):

```
>.pathfind
[INFO] Usage: .pathfind <X> <Z>
```

#### Pathfind

* X: `Number`
* Z: `Number`

Same as moveTo but uses advanced pathfinding (bad with anti cheats):

```
>.pathfind
[INFO] Usage: .pathfind <X> <Z>
```

#### Forcemove

* Direction: `String`: Direction to move to
  * up: Will jump
  * forward
  * back
  * left
  * right
* Time: `Number`: Time in seconds

Move the player in seconds:

```
>.forcemove
[INFO] Usage: .forcemove <Dircetion:up|forward|back|left|right> <Time:Seconds>
```

#### Control

**You can also use .control clearall which would clear all states**

* Control: `String`: Which control's state to change
  * forward
  * back
  * left
  * right
  * jump
  * sneak
* State: `Boolean`

Set a control state of the player:

```
>.control
[INFO] Usage: .control <Control: forward|back|left|right|jump|sneak> <State: Boolean>
```

#### Follow

* Player: `String`: Player name
* Range: `Number`: How close you should stay to the player

Follow a player:

```
>.follow
[INFO] Usage: .follow <EntityMatches:$name=pig|$name!=pig|...> <Range>. Range > 0
```

#### smartFollow

* Player: `String`: Player name
* Range: `Number`: How close you should stay to the player

Same as follow but uses advanced pathfinding (bad with anti cheats):

```
>.smartfollow
[INFO] Usage: .smartfollow <EntityMatches:$name=pig|$name!=pig|...> <Range>. Range > 0
```

#### Unfollow

Stop following:

```
>.unfollow
[INFO] Not following anyone
```

#### Attack

* Matches: `String`: Nearest entity with all matches true
* CPS: `Number`: Clicks per second
* MaxReach: `Number`: Max distance from entity
* MinReach `Number`: Min distance from entity

Attack an entity:

```
>.attack
[INFO] Usage: .attack <EntityMatches:$name=pig|$name!=pig|...> <CPS> <MaxReach> <MinReach>. MaxReach > MinReach, CPS > 0MinReach, CPS > 0
```

##### Examples

Attack all passive mobs or zombies:

```
>.attack 'kind=Passive mobs|name=zombie' 6 5 1
[OK] Attacking nearest entity with 6CPS if kind=Passive mobs,name!=cow and MinReach(1) < distance < MaxReach(5)
```

Attack all players except a player named 'team123':

```
>.attack 'name=player&username!=team123' 6 5 1
[OK] Attacking nearest entity with 6CPS if kind=Passive mobs,name!=cow and MinReach(1) < distance < MaxReach(5)
```

#### Stopattack

Stop attacking:

```
>.stopattack
[INFO] Not attacking anyone
```

#### Look

**You can only use either Direction or Yaw and Pitch**

* Direction? (optional): `String`
  * north
  * south
  * east
  * west
* Yaw? (optional): `Number`
* Pitch? (optional): `Number`

Look in a certain direction:

```
>.look
[INFO] Usage: .look <Direction?:north|south|east|west> <Yaw?> <Pitch?>
```

#### Lookat

* Player: `String`: Player name
* MaxReach: `Number`: Maximum distance between you and the player
* MinReach: `Number`: Minimum distance between you and the player
* Force? (optional): `string`
  * yes, y: Will snap to the player and keep them at the center of its eyes
  * no, n: Will slowly turn

Look at a player:

```
>.lookat
[INFO] Usage: .lookat <Player> <MaxReach> <MinReach> <Force?:yes|y|no|n>. MaxReach > MinReach (duh)
```

#### Stoplook

Stop looking:

```
>.stoplook
[INFO] Not looking at anyone
```

#### Inventory

* ID: `String`/`Integer`: Container to open. 0 = inventory, 1 = container.
  * 0, inventory: Will open the inventory
  * 0, inventory: Will open the currently opened container
* Action? (optional): `String`: click, move, drop, dropall
* Arg1? (optional): Arguments for `Action`
* Arg1? (optional): Arguments for `Action`

Inventory management:

```
>.inventory
[INFO] Usage: .inventory <ID: inventory|container|0|1> <Action?: click|move|drop|dropall> <Arg1?> <Arg2?>
```

#### Open

* X: `Number`
* Y: `Number`
* Z: `Number`

Open a container (chest):

```
>.open
[INFO] Usage: .open <X> <Y> <Z>
```

#### ChangeSlot

* Slot: `Integer`: 0 <= Slot <= 8. Slot to switch to

Change the selected hotbar slot:

```
>.changeslot
[INFO] Usage: .changeslot <Slot>. -1 < Slot < 9
```

#### Useitem

* Time? (optional): `Number`: How long you should keep using that item. Defaults to 0.1

Use a held item:

```
>.useitem
[INFO] Used an item for 0.1 seconds
```

* You can specify for how long you should use an item. By default it's 0.1 seconds

#### Set

* Key: `String`
* Value: `Any`

Set a variable:

```
>.set
[INFO] Usage: .set <Key> <Value>
```

* You can access a variable by:

```
.set var1 123
.set var2 abc
.send %var1%, %var2%
<Player123> 123, abc
```
#### Unset

* Key: `String`

Delete a variable:

```
>.unset
[INFO] Usage: .unset <Key>
```

#### Value

* Key: `String`

Get value of a variable:

```
>.value
[INFO] Usage: .set <Key>
```

#### Variables

List all set variables:

```
>.variables
[INFO] Values:
       Amogus: Sussy
```

#### Script

* Path: `String`: Path to the script on your PC

Run a script:

```
>.script
[INFO] Usage: .script <Path>
```

#### Help

Show a list of all commands:

```
>.help
[INFO] .exit           Disconnect from the server
       .reco           Reconnect to server
       .send           Send a message in chat
       .position       Show current position
       .distance       Show the distance between two points
       .list           List players connected to the server and their ping
       .blocks         Show blocks in a specified radius and filter
       .dig            Dig a block in a specific location if possible
       .stopdig        Stop digging
       .place          Place a block in a specific location if possible
       .move           Move the player in blocks
       .pathfind       Move to a specific set of coordinates
       .forcemove      Move the player in seconds
       .control        Set a control state of the player
       .follow         Follow a player
       .smartFollow    Same as follow but uses advanced pathfinding
       .unfollow       Stop following
       .attack         Attack an entity
       .stopattack     Stop attacking
       .look           Look in a certain direction
       .lookat         Look at a player
       .stoplook       Stop looking
       .inventory      Inventory management
       .open           Open a container (chest)
       .changeslot     Change selected hotbar slot
       .useitem        Use a held item
       .set            Set a variable
       .unset          Delete a variable
       .value          Get value of a variable
       .variables      List all set variables
       .script         Run a script
       .help           Shows this help message
```

### Plugins

> Note: If you do not know how to code you can just use [scripts](#scripts) to make powerfull bots

#### Loading plugins

To load a plugin you must specify the plugin path inside the `plugins.toml` file located in your config directory.

You can load more than one plugin at once.

```.toml
# PluginName = '/Plugin/Path'
# Example
# 'Map Downloader' = 'C:\Users\User\Desktop\mapdown\downloader.js'
[builtin]
mapDownloader = false
autoFish = false

[user]
'Fly hacks' = 'C:\Users\User\Desktop\hacks\fly.js'
```

Example of a very basic plugin:

```javascript
const name = 'Test plugin';

let lib;
const load = (LIB) => {
	lib = LIB;
};

const main = () => {
	lib.success('Example success message');
	lib.info('Example info message');
	lib.warn('Example warning');
	lib.error('Example error');

	lib.info('I just added a \'.test\' command!');
	lib.commands.test = () => {
		lib.success('TEST COMMAND WORKS!!!');
	};
};

module.exports = { load, main, name };

```

```
$ mc-term -c ! Player ! localhost 1.12
[OK] Connected.
[OK] Successfully loaded the 'Test plugin'
[OK] Example success message
[INFO] Example info message
[WARN] Example warning
[ERR] Example error
[INFO] I just added a '.test' command!
>.test
[OK] TEST COMMAND WORKS!!!
>
```

#### Making plugins

Right now the only documentation we have is an example plugin.

More documentation will be added in the future though.

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
.send I just sent a message in chat!

# Doesn't work
I just sent a message in chat!
```

#### Script only commands

##### Wait

Wait for a specific amount of seconds before running the next command:

##### Success, Info, Warn, Error

Print a message to console

```bash
send First message
# Waits 1 second before running the second command
wait 1
send Second message
```

#### Running a script

```
>.script /path/to the/script
```

Example:

```
>.script scripts/HelloWorld
[INFO] Reading script
<Player123> Hello world!
[INFO] Reached end of script
```

### Hotkeys


| Hotkey            | What it does                                |
| :------------------ | :-------------------------------------------- |
| CTRL-B            | Move back one character without deleting    |
| CTRL-F            | Move forward one character without deleting |
| BACKSPACE         | Delete one character backwards              |
| DEL               | Delete one character forwards               |
| ESC-B, CTRL-LEFT  | Move back one word without deleting         |
| ESC-F, CTRL-RIGHT | Move forward one word without deleting      |
| ALT-BACKSPACE     | Delete or “kill” one word backwards       |
| ESC-D, ALT-DEL    | Delete or “kill” one word forwards        |
| CTRL-A, HOME      | Move cursor to the beginning of the line    |
| CTRL-E, END       | Move cursor to the end of the line          |
| CTRL-U            | Kill forward to the beginning of a line     |
| CTRL-K            | Kill forward to the end of a line           |
| CTRL-L            | Clears the screen                           |

### Shortcuts and tips

#### Command-line

##### --conf !

* When using the --conf option you can put `!` to skip one prompt:

```bash
$ mc-term --conf cracked Player123 ! localhost !
```

First `!` Skips password prompt because this is a cracked account.

Second `!` uses default version (1.12.2).

#### In game

##### EntityMatches

Entity matches are used for `attack`, `follow` and `smartFollow` commands.

They're used to get the nearest entity with the specified conditions. e.g:

```
.attack $type=player&username!=teamMember12 6 3 0.5
```

`$type` starts with a `$` so it will be replaced by the value of the property `player` inside of the entity object.

So the entity must be of type `player` and its username must not be `teamMember12`.


##### Position ~ ~ ~

* When trying to type your coordinates you can just type `~ ~ ~` and it will auto replace:

```
<AnotherPlayer> Where are you?
>.send I am at: ~ ~ ~!
<You> I am at: 512.5 76 1535!
```

This only works with commands:

```
>~ ~ ~
<You> ~ ~ ~
```

You can also replace one of the `~`

```
>.send ~ ~ ~
<You> 512.5 76 1535
>.send ~ 420 ~
<You> 512.5 420 1535
```

Relative position also works

```
>.send ~ ~ ~
<You> 512.5 76 1535
>.send ~100 ~+100 ~-1005
<You> 612.5 176 530
```

##### quotes

* When typing an argument for a command that has spaces, you should wrap it inside of quotes

```
>.attack 'kind=Hostile mobs' 12 3 0.5
```

Double quotes also work

```
>.attack "kind=Hostile mobs" 12 3 0.5
```

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
$
```

### Configuration

Go to the configuration directory:

```bash
$ mc-term -gcp
Path to config: /path/to/config/dir
$ cd /path/to/config/dir
$ ls
config.toml  credentials.toml  physics.toml
```

Then you should edit the config files as you want.

### Credentials

The 'credentials.toml' file.

#### Auth

* microsoft
* mojang (deprecated)
* cracked

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

The 'config.toml' file.

##### enableNonVanillaCMD

* boolean

When true it enables commands that use non vanilla features which may get you banned in some servers. Use at your own risk.

##### canDig

* boolean

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

* Boolean

Should the bot use physics (e.g. knockback, gravity).

Disabling this will get you banned on most servers.

##### bot.settings

###### bot.settings.chat

* Enabled
* Disabled
* CommandOnly

###### bot.settings.colorsEnabled

* Boolean

If set to false the bot tells the server to not send colored messages.

It's up to the server to decide if they should respect this option or not.

###### bot.settings.viewDistance

* tiny
* short
* normal
* far

The render distance.

###### bot.settings.mainHand

* left
* right

Specify which hand is the main hand.

###### bot.settings.enableTextFiltering

* Boolean

###### bot.settings.enableServerListing

* Boolean

Whether or not the player would show up in server listings.

##### bot.settings.skinParts

###### bot.settings.skinParts.showCape

* Boolean

###### bot.settings.skinParts.showJacket

* Boolean

###### bot.settings.skinParts.showLeftSleeve

* Boolean

###### bot.settings.skinParts.showRightSleeve

* Boolean

###### bot.settings.skinParts.showLeftPants

* Boolean

###### bot.settings.skinParts.showRightPants

* Boolean

###### bot.settings.skinParts.showHat

* Boolean

##### bot.settings.pathfinder

###### bot.settings.pathfinder.thinkTimeout

* Number

###### bot.settings.pathfinder.tickTimeout

* Number

###### bot.settings.pathfinder.searchRadius

* Number

###### bot.settings.pathfinder.enablePathShortcut

* Boolean

###### bot.settings.pathfinder.LOSWhenPlacingBlocks

* Boolean

### Physics

WIP
