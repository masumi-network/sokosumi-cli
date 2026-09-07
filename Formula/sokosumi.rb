# Homebrew formula for the Sokosumi CLI.
# HEAD-only until the repo has a tagged release; after tagging, add a stable
# `url` + `sha256` pointing at the release tarball so plain `brew install` works.
#
#   brew install --HEAD ./Formula/sokosumi.rb
#   export SOKOSUMI_OAUTH_CLIENT_ID='...'   # from Developer → OAuth clients
#   sokosumi
#
class Sokosumi < Formula
  desc "Terminal interface for the Sokosumi agent marketplace"
  homepage "https://github.com/masumi-network/sokosumi-cli"
  license "MIT"
  head "https://github.com/masumi-network/sokosumi-cli.git", branch: "main"

  depends_on "node"

  def install
    system "npm", "install", *std_npm_args
    bin.install_symlink Dir["#{libexec}/bin/*"]
  end

  test do
    assert_match "sokosumi", shell_output("#{bin}/sokosumi --version")
  end
end
