const hre = require("hardhat");

async function main() {
  const Certificate = await hre.ethers.getContractFactory("Certificate");
  const certificate = await Certificate.deploy();
  await certificate.waitForDeployment();

  const address = await certificate.getAddress();
  console.log("Certificate contract deployed to:", address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
