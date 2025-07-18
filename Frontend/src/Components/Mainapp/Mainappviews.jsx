// Mainappviews.js
import React from "react";
import Dashboard from "./Dashboard/Dashboard";
import Apphome from "./Apphome/Apphome";
import Accounts from "./Accounts/Accounts";
import Settings from "./Settings/Settings";
import Inventory from "./Inventory/Inventory";
// Import Submenu Components for Inventory
import ProductList from "./Inventory/InventroyPages/ProductList";
import ProductPurchase from "./Inventory/InventroyPages/ProductPurchase";
import ProductSale from "./Inventory/InventroyPages/ProductSale";
import StartingStockInfo from "./Inventory/InventroyPages/StartingStockInfo";
import Reports from "./Inventory/InventroyPages/Reports";

// Import Submenu Components for Settings
import DairySettings from "./Settings/DairySettings/DairySettings";
import InventorySettings from "./Settings/InventorySettings/InventorySettings";
import MachineSettings from "./Settings/MachineSettings/MachineSettings";
import MainLedger from "./Masters/MasterPages/MainLedger";
import SubLedger from "./Masters/MasterPages/SubLedger";
import MilkRateMaster from "./Masters/MasterPages/RatechartMaster/MilkRateMaster";
import EmployeeMaster from "./Masters/MasterPages/EmployeeMaster/EmployeeMaster";
import DairyInfo from "./DairyInfo/DairyInfo";
import DairyInitialInfo from "./DairyInfo/DairyInitialInfo";
import CustomersMaster from "./Masters/MasterPages/CustomerMaster/CustomersMaster";
import Centers from "./DairyInfo/Centers/Centers";
import Profile from "./Profile/Profile";
import MilkcollectionReports from "./Reports/MilkReports/MilkcollectionReports";
import MilkCorrection from "./Payments/PaymentPages/MilkCorrection/MilkCorrection";
// import PayDeductions from "./Payments/PaymentPages/PayDeductions";
import Payments from "./Payments/Payments";
import PayDeductions from "./Payments/PaymentPages/PayDeductions/PayDeductions";
import MilkTransfer from "./Payments/PaymentPages/MilkTransfers/MilkTransfer";
import PaymentReports from "./Reports/PaymentsReports/PaymentReports";
import CustomerReports from "./Reports/CustomerReports/CustomerReports";
import CattleFeedMaster from "./Sales/CattleFeed/CattleFeedMaster";
import BankMaster from "./Masters/MasterPages/BankMaster/BankMaster";
import PurchaseMaster from "./Purchase/CattleFeed/PurchaseMaster";
import PurchaseGroceryMaster from "./Purchase/Grocery/PurchaseGroceryMaster";
import PurchaseMedicinesMaster from "./Purchase/Medicines/PurchaseMedicinesMaster";
import OthersPurMaster from "./Purchase/Others/OthersPurMaster";
import GroceryMaster from "./Sales/Grocery/GroceryMaster";
import MedicinesMaster from "./Sales/Medicines/MedicinesMaster";
import OthersMaster from "./Sales/Others/OthersMaster";
import Dealers from "./Inventory/InventroyPages/Dealers/Dealers";
import Products from "./Inventory/InventroyPages/Products/Products";
import DayBook from "./Accounts/Credit/DayBook";
import AccoundStatment from "./Accounts/AccoundStatment/AccoundStatment";
import TrnCheck from "./Inventory/InventroyPages/TrnCheck/TrnCheck";
import FatSnfCompromise from "./Payments/FatSnfCompromise/FatSnfCompromise";

// import MilkReports from "./Reports/MilkReports/MilkReports";
// import MilkcollectionReports from "./Reports/MilkReports/MilkcollectionReports";

const Mainappviews = ({ index }) => {3
  switch (index) {
    case 0:
      return <Dashboard />;
    case 1:
      return <Apphome />;
    case 2:
      return <Inventory />;
    // Inventory Submenus
    case 2.1:
      return <Dealers />;
    case 2.2:
      return <Products />;
    case 2.3:
      return <ProductSale />;
    case 2.4:
      return <StartingStockInfo />;
    case 2.5:
      return <Reports />;
    case 2.6:
      return <TrnCheck />;

    case 3:
      return <Accounts />;
      case 3.1:
        return <DayBook/>
        
      case 3.2:
        return <AccoundStatment/>;

    // Master Submenus
    case 4.1:
      return <MainLedger />;
    case 4.2:
      return <SubLedger />;
    case 4.3:
      return <CustomersMaster />;
    case 4.4:
      return <EmployeeMaster />;
    case 4.5:
      return <BankMaster />;
    case 4.6:
      return <MilkRateMaster />;
    //Purchase Submenus
    case 5.1:
      return <PurchaseMaster />;
    case 5.2:
      return <PurchaseGroceryMaster />;
    case 5.3:
      return <PurchaseMedicinesMaster />;
    case 5.4:
      return <OthersPurMaster />;
    //Sales Submenus
    case 6.1:
      return <CattleFeedMaster />;
    case 6.2:
      return <GroceryMaster />;
    case 6.3:
      return <MedicinesMaster />;
    case 6.4:
      return <OthersMaster />;
    //Report Submenus
    case 7.1:
      return <MainLedger />;
    case 7.2:
      return <MilkcollectionReports />;
    case 7.3:
      return <CustomerReports />;
    case 7.4:
      return <EmployeeMaster />;
    case 7.5:
      return <MilkRateMaster />;
    case 7.6:
      return <MilkRateMaster />;
    case 7.7:
      return <PaymentReports />;
    case 7.8:
      return <IRPurchesReport />;
   
    //Payments Submenus
    case 8.1:
      return <MilkCorrection />;
    case 8.2:
      return <MilkTransfer />;
    case 8.3:
      return <PayDeductions />;
    case 8.4:
      return <Payments />;
    case 8.5:
      return <FatSnfCompromise/>;
    //Dairy Submenus
    case 9.1:
      return <DairyInfo />;
    case 9.2:
      return <DairyInitialInfo />;
    case 9.3:
      return <Centers />;
    // Settings Submenus
    case 10.1:
      return <DairySettings />;
    case 10.2:
      return <InventorySettings />;
    case 10.3:
      return <MachineSettings />;
    case 11:
      return <Profile />;
    default:
      return <Dashboard />;
  }
};

export default Mainappviews;
