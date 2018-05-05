#for d in world_mnt/* ; do
#	if [[ $d != "session.lock" ]]; then
#		echo world/$(basename $d)
#		ln $d world/$(basename $d)
#	fi
#done

java -jar spigot.jar
