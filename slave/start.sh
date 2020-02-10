./build.sh
docker run -p $1:25565 \
                       --mount src=minecraft_world_playerdata,dst=/world/playerdata \
                       --mount src=minecraft_world_data,dst=/world/data \
                       --mount src=minecraft_world_region,dst=/world/region \
                       slave
