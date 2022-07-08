#!/bin/sh

CWD=$(cd -P -- "$(dirname -- "$0")" && pwd -P)

# curl https://raw.githubusercontent.com/redis/redis/6.0/redis.conf > $CWD/redis.conf

if [ "$1" = "--auth" ]; then
	shift
	echo "...using authentication"
	CONF=/usr/local/etc/redis.conf
	OPTS="-v $CWD/redis.conf:$CONF"
fi

has_cmd () {
	type $1 > /dev/null 2>&1
	echo $?
}

docker=podman
if [ $(has_cmd "$docker") -ne 0 ]; then
	docker=docker
fi

$docker run -it --rm --name redis \
	$OPTS \
	-p 6379:6379 \
	docker.io/library/redis:7-alpine $CONF $@
