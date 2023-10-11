repos := header-app home-app

install:
	for repo in $(repos); do \
		cd $$repo && \
		yarn add -D \
				webpack \
				webpack-cli \
				html-webpack-plugin \
				webpack-dev-server \
				babel-loader css-loader && \
		cd ../; \
	done
