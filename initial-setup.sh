#!/bin/bash

# Initial Setup Script for AWS EC2 Instance
# Run this script first on a fresh EC2 instance

set -e  # Exit on any error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Genvedha Website - Initial EC2 Setup${NC}"
echo -e "${GREEN}========================================${NC}"

# Function to print colored messages
print_message() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check if running on Amazon Linux or Ubuntu
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$ID
    print_message "Detected OS: $OS"
else
    print_error "Cannot detect OS"
    exit 1
fi

# Update system packages
print_message "Updating system packages..."
if [ "$OS" = "amzn" ] || [ "$OS" = "rhel" ] || [ "$OS" = "centos" ]; then
    sudo yum update -y
elif [ "$OS" = "ubuntu" ] || [ "$OS" = "debian" ]; then
    sudo apt-get update -y
    sudo apt-get upgrade -y
fi

# Install Git
print_message "Installing Git..."
if [ "$OS" = "amzn" ] || [ "$OS" = "rhel" ] || [ "$OS" = "centos" ]; then
    sudo yum install git -y
elif [ "$OS" = "ubuntu" ] || [ "$OS" = "debian" ]; then
    sudo apt-get install git -y
fi

git --version

# Install Node.js 18.x
print_message "Installing Node.js 18.x..."
if [ "$OS" = "amzn" ] || [ "$OS" = "rhel" ] || [ "$OS" = "centos" ]; then
    curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
    sudo yum install -y nodejs
elif [ "$OS" = "ubuntu" ] || [ "$OS" = "debian" ]; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

print_message "Node.js version: $(node --version)"
print_message "NPM version: $(npm --version)"

# Install PM2 globally
print_message "Installing PM2 process manager..."
sudo npm install -g pm2

# Install build essentials (needed for some npm packages)
print_message "Installing build tools..."
if [ "$OS" = "amzn" ] || [ "$OS" = "rhel" ] || [ "$OS" = "centos" ]; then
    sudo yum groupinstall "Development Tools" -y
elif [ "$OS" = "ubuntu" ] || [ "$OS" = "debian" ]; then
    sudo apt-get install build-essential -y
fi

# Configure Git (optional - only needed for pushing changes)
print_message "Configuring Git..."
print_warning "Git configuration is optional for deployment (only needed if you plan to push changes)"
read -p "Configure Git now? (y/N): " configure_git

if [[ "$configure_git" =~ ^[Yy]$ ]]; then
    read -p "Enter your Git username: " git_username
    if [ ! -z "$git_username" ]; then
        git config --global user.name "$git_username"
    fi

    read -p "Enter your Git email: " git_email
    if [ ! -z "$git_email" ]; then
        git config --global user.email "$git_email"
    fi
    print_message "Git configured successfully"
else
    print_message "Skipping Git configuration (you can configure later if needed)"
fi

# Clone repository
print_message "Cloning Genvedha repository..."
cd "$HOME"

APP_DIR="$HOME/genvedha-website"

if [ -d "$APP_DIR" ]; then
    print_warning "Directory $APP_DIR already exists. Skipping clone."
else
    git clone -b production https://github.com/yogmca/genvedha.git genvedha-website
    print_message "Repository cloned successfully to $APP_DIR"
fi

cd genvedha-website

# Create .env file from example
if [ ! -f ".env" ]; then
    print_message "Creating .env file from template..."
    cp .env.example .env
    print_warning "Please edit .env file with your configuration:"
    print_warning "nano .env"
else
    print_message ".env file already exists"
fi

# Make deployment scripts executable
print_message "Making deployment scripts executable..."
chmod +x deploy.sh setup-https.sh

# Display next steps
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Initial Setup Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo -e "1. Configure environment variables:"
echo -e "   ${GREEN}cd $HOME/genvedha-website${NC}"
echo -e "   ${GREEN}nano .env${NC}"
echo ""
echo -e "2. Deploy the application:"
echo -e "   ${GREEN}./deploy.sh${NC}"
echo ""
echo -e "3. Setup HTTPS (after DNS is configured):"
echo -e "   ${GREEN}sudo ./setup-https.sh${NC}"
echo ""
echo -e "${YELLOW}Important:${NC}"
echo -e "- Make sure your domain's DNS A record points to this server's IP"
echo -e "- Configure AWS Security Group to allow ports 22, 80, and 443"
echo -e "- Update .env file with your SMTP and other credentials"
echo ""
echo -e "${GREEN}Server IP Address:${NC}"
curl -s http://checkip.amazonaws.com || echo "Unable to fetch IP"
