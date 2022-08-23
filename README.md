# Minecraft Terminal

Minecraft Terminal is a lightweight CLI app that allows you to play minecraft in the terminal.

[![Codacy Badge](https://app.codacy.com/project/badge/Grade/5d815c7321aa468fa37b3f3509757b6c)](https://www.codacy.com/gh/MC-Terminal/Minecraft-Terminal/dashboard?utm_source=github.com&utm_medium=referral&utm_content=MC-Terminal/Minecraft-Terminal&utm_campaign=Badge_Grade)

This README is a work in progress:

- [X] [Downloads](#downloads)
- [ ] [Usage](#usage)
  - [X] [Command-line usage](#command-line-usage)
  - [ ] [Internal commands (10%)](#internal-commands)
  - [X] [Scripts](#scripts)
  - [X] [Hotkeys](#hotkeys)
  - [X] [Remote control (RCON)](#remote-control)
  - [ ] [Configuration](#configuration)
    - [ ] Credentials
    - [ ] Configuration
    - [ ] Physics

## Downloads

### Install with npm

```
$ npm i -g mc-term
$ mc-term
```

Alternatively you can clone the git repo.

### Clone git repo

```
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
$ node . --c ! Player456 '' ! !
Password :
```

* '!' will use the login options specified in cred.json if no options are set it will use defaults
* '' will prompt

Do not use the credentials file cred.json:

```
$ node .  --no-cred
[WARN] Not using "credentials.json" because of --no-cred
Auth :
Login :
Password :
Server :
Version :
```

Do not use the configuration file config.json:

```
$ node . --no-conf
[WARN] Not using "config.json" because of --no-conf
Auth :
Login :
Password :
Server :
Version :
```

Set the configuration files path and exit:

```
$ node . --set-conf-path /home/user/.config/mc-term
```

Print the configuration files location and exit:

```
$ node . --get-conf-path
Path to config: /home/user/.config/mc-term
```

Generate default configuration files in the specified location:

```
$ node . --gen-conf /home/user/.config/mc-term
```

### Internal commands

Disconnect from the server:

```
[INFO] Connected.
>.exit
$
```

Reconnect to server:

```
[INFO] Connected.
>.reco
[INFO] Connected.
```

Move the player in blocks:

```

```

Move the player in seconds:

```

```

Follow a player:

```

```

Stop following a player:

```

```

Attack a player:

```

```

Stop attacking a player:

```

```

Send a message in chat:

```

```

Inventory management:

```

```

Use an item:

```

```

Change the selected hotbar slot:

```

```

Run a script:

```

```

Look at a player:

```

```

Stop looking at a player:

```

```

Look in a specific direction:

```

```

Set the control state of the player:

```

```

Show a list of all connected players on the server (and their ping):

```

```

Show a list of all commands:

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

WIP
