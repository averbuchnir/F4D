import re
import subprocess


# Function to get the MAC address in lowercase without colons
def get_mac_adress():
    # Get the MAC address of the device
    mac = subprocess.check_output('cat /sys/class/net/eth0/address', shell=True).decode('utf-8').strip()
    # Remove colons from the MAC address
    mac = re.sub(':', '', mac)
    # Convert the MAC address to lowercase
    mac = mac.lower()
    return mac


def update_env_file(env_file_path, var_name, mac_address):
    # Initialize flag to determine if the file needs to be updated
    file_needs_update = False
    try:
        with open(env_file_path, 'r') as file:
            content = file.readlines()
        # Compile a regex pattern to match the desired environment variable
        mac_pattern = re.compile(rf'^{var_name}=(.*)')

        for i, line in enumerate(content):
            match = mac_pattern.match(line)
            if match:
                existing_mac = match.group(1).strip()
                if existing_mac != mac_address:
                    content[i] = f"{var_name}={mac_address}\n"
                    file_needs_update = True
                    print(f"Updated {var_name} in {env_file_path}.")
                else:
                    print(f"{var_name} is already up to date in {env_file_path}.")
                break
        else:
            # This block executes if the for loop completes without breaking, meaning the var was not found
            content.append(f"{var_name}={mac_address}\n")
            file_needs_update = True
            print(f"Appended {var_name} to {env_file_path}.")

        if file_needs_update:
            with open(env_file_path, 'w') as file:
                file.writelines(content)
                print(f"Successfully updated {env_file_path}.")

    except IOError as e:
        print(f"Error accessing {env_file_path}: {e}")


env_path  = ["/home/pi/6to4/.env","/home/pi/6to4/.env","/home/pi/6to4/.env"]
env_var_name = ["BUCKET_NAME", "LOCAL_BUCKET", "CLOUD_BUCKET"]

# Main Logic
for path,var_name in zip(env_path,env_var_name):
    MAC_ADRESS = get_mac_adress()
    update_env_file(path,var_name,MAC_ADRESS)

