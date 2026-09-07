class Sokosumi < Formula
  desc "Terminal interface for the Sokosumi agent marketplace"
  homepage "https://github.com/masumi-network/sokosumi-cli"
  url "https://github.com/masumi-network/sokosumi-cli/archive/refs/tags/v2.1.0.tar.gz"
  sha256 "abadb6ad9cd17eb378bbeaabd430db719bea93413d6e85751a1485313358f265"
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
