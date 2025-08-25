#!/bin/sh

cd ~/Documents/Workspace/javascriptProjects/mycomponent-editor/src/figmaV3
find ./ -name "*.ts*" | awk '{sub(/^\.\//, "/"); print "https://raw.githubusercontent.com/myseason/mycomponent-editor/refs/heads/master/src/figmaV3"$0}' > ./source_list.txt