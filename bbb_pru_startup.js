//****************************************************************************
// BBB_PRU_STARTUP.JS
// Version 0.20.00
// Released subject to the license at the end of this file
//****************************************************************************

//----------------------------------------------------------------------------
// Purpose: Prepare the AM355x SOC so CCS can connect to the PRU as if it were
// any other standalone CPU.  
//
// This script is only intended to be used as described in 
// http://processors.wiki.ti.com/index.php/Debug_Configuration_Initialization_Scripts
// In particular, it does NOT WORK as a standalone script.  
//
// Presumptions:
// - Target system is BeagleBone Black or BeagleBone White
// - The target configuration has launched
// - PRU connection occurs after this script runs
//----------------------------------------------------------------------------

//----------------------------------------------------------------------------
// Constants
//----------------------------------------------------------------------------
var AM335X_INPUT_EN   = 1 << 5;
var AM335X_PULL_DISA  = 1 << 3;
var AM335X_PIN_OUTPUT = 0;
var AM335X_PIN_INPUT  = AM335X_INPUT_EN | AM335X_PULL_DISA;

//----------------------------------------------------------------------------
// Invoke the main function in this file
//----------------------------------------------------------------------------
startup_pru();

//****************************************************************************
// STARTUP_PRU
//****************************************************************************
function startup_pru()
{
   var errCode = 0;

   //-------------------------------------------------------------------------
   // Import the DSS packages into our namespace to save on typing
   //-------------------------------------------------------------------------
   importPackage(Packages.com.ti.debug.engine.scripting);
   importPackage(Packages.com.ti.ccstudio.scripting.environment);
   importPackage(Packages.java.lang);

   //-------------------------------------------------------------------------
   // Create our scripting environment object - which is the main entry
   // point into any script and the factory for creating other Scriptable
   // servers and Sessions
   //-------------------------------------------------------------------------
   script = ScriptingEnvironment.instance();

   //-------------------------------------------------------------------------
   // Get the Debug Server and start a Debug Session
   //-------------------------------------------------------------------------
   debugServer = script.getServer("DebugServer.1");

   //-------------------------------------------------------------------------
   // Open a session on the Debug Access Port (DAP)
   //-------------------------------------------------------------------------
   var debugSessionDAP = debugServer.openSession("*", "CS_DAP_DebugSS");

   //-------------------------------------------------------------------------
   // Connect to the DAP.  Error check.
   //-------------------------------------------------------------------------
   print("Connecting to DAP");
   try
   {
      debugSessionDAP.target.connect();
   }
   catch (ex)
   {
      errCode = getErrorCode(ex);
      print("Error code #" + errCode + ", could not connect to DAP!");
      print("Aborting!");
      java.lang.System.exit(errCode != 0 ? errCode : 1);
   }

   //-------------------------------------------------------------------------
   // Init steps for PRU carried out by the DAP
   //-------------------------------------------------------------------------
   print("Configuring PRU pins");
   PRU_PINMUX_Config(debugSessionDAP.memory);

   print("Enabling ICSS clock");
   debugSessionDAP.expression.evaluate(
      "*((unsigned int*) 0x44E000E8 ) |= 0x02;");

   print("Resetting ICSS");
   debugSessionDAP.expression.evaluate(
      "*((unsigned int*) 0x44E00C00 ) |= 0x2;");
   debugSessionDAP.expression.evaluate(
      "*((unsigned int*) 0x44E00C00 ) &= 0xFFFFFFFD;");

   print("Done");
}

//****************************************************************************
// PRU_PINMUX_Config
//****************************************************************************
function PRU_PINMUX_Config(dsDAP_mem)
{
   // GEL_TextOut("****** PRU Cape GPI/O PINMUX is being configured  ***** \n","Output",1,1,1);

   //-------------------------------------------------------------------------
   // LEDS
   //-------------------------------------------------------------------------
   //red led  = pru0 r30_3  ARM pin c12
   dsDAP_mem.writeData(0, 0x44e1099c, AM335X_PIN_OUTPUT | 5, 32); //mode 5

   //green led = pru0 r30_2 arm pin d12
   dsDAP_mem.writeData(0, 0x44e10998, AM335X_PIN_OUTPUT | 5, 32); //mode 5

   //blue led  = pru0 r30_0 arm pin a13
   dsDAP_mem.writeData(0, 0x44e10990, AM335X_PIN_OUTPUT | 5, 32); //mode 5

   //orange led = pru0 r30_1 arm pin b13 
   dsDAP_mem.writeData(0, 0x44e10994, AM335X_PIN_OUTPUT | 5, 32); //mode 5

   //RGB_0 led = pru1 r30_2 arm pin r3 
   dsDAP_mem.writeData(0, 0x44e108AC, AM335X_PIN_OUTPUT | 5, 32); //mode 5

   //RGB_1 led = pru1 r30_3 arm pin r4 
   dsDAP_mem.writeData(0, 0x44e108B0, AM335X_PIN_OUTPUT | 5, 32); //mode 5

   //RGB_2 led = pru0 r30_4 arm pin t1 
   dsDAP_mem.writeData(0, 0x44e108B4, AM335X_PIN_OUTPUT | 5, 32); //mode 5

   //-------------------------------------------------------------------------
   // Switches
   //-------------------------------------------------------------------------
   //switch 1 = pru0 r31_5 c13
   dsDAP_mem.writeData(0, 0x44e109a4, AM335X_PIN_INPUT  | 6, 32); //mode 6

   //switch 2 = pru0 r31_7 a14	
   dsDAP_mem.writeData(0, 0x44e109ac, AM335X_PIN_INPUT  | 6, 32); //mode 6

   //-------------------------------------------------------------------------
   // Audio
   //-------------------------------------------------------------------------
   //audio data pr1 r30_0 r1 
   dsDAP_mem.writeData(0, 0x44e108a0, AM335X_PIN_OUTPUT | 5, 32); //mode 5

   //audio clk pr1 r30_1 r2
   dsDAP_mem.writeData(0, 0x44e108a4, AM335X_PIN_OUTPUT | 5, 32); //mode 5

   //audio sync pr1 r30_2 r3
   dsDAP_mem.writeData(0, 0x44e108a8, AM335X_PIN_OUTPUT | 5, 32); //mode 5

   //-------------------------------------------------------------------------
   // UART
   //-------------------------------------------------------------------------
   //Uart txd d15
   dsDAP_mem.writeData(0, 0x44e10984, AM335X_PIN_OUTPUT | 5, 32); //mode 5

   //UART rxd d16
   dsDAP_mem.writeData(0, 0x44e10980, AM335X_PIN_INPUT  | 5, 32); //mode 5

   //UART rts b17
   dsDAP_mem.writeData(0, 0x44e1097C, AM335X_PIN_OUTPUT | 5, 32); //mode 5

   //UART cts a17
   dsDAP_mem.writeData(0, 0x44e10978, AM335X_PIN_INPUT  | 5, 32); //mode 5

   //-------------------------------------------------------------------------
   // LCD
   //-------------------------------------------------------------------------
   //lcd rs t3 
   dsDAP_mem.writeData(0, 0x44e108B8, AM335X_PIN_OUTPUT | 4, 32); //mode 4

   //lcd r/w t4
   dsDAP_mem.writeData(0, 0x44e108BC, AM335X_PIN_OUTPUT | 4, 32); //mode 4

   //lcd e v5 
   dsDAP_mem.writeData(0, 0x44e108E8, AM335X_PIN_OUTPUT | 4, 32); //mode 4

   //lcd data4 b16 
   dsDAP_mem.writeData(0, 0x44e10958, AM335X_PIN_OUTPUT | 6, 32); //mode 6

   //lcd data5 a16
   dsDAP_mem.writeData(0, 0x44e1095C, AM335X_PIN_OUTPUT | 6, 32); //mode 6

   //lcd data6 u5 
   dsDAP_mem.writeData(0, 0x44e108e0, AM335X_PIN_OUTPUT | 4, 32); //mode 4

   //lcd data7 r5 
   dsDAP_mem.writeData(0, 0x44e108e4, AM335X_PIN_OUTPUT | 4, 32); //mode 4	

   //-------------------------------------------------------------------------
   // TEMP SENSOR
   //-------------------------------------------------------------------------
   //gpmc ad14 - input (GPI direct)
   dsDAP_mem.writeData(0, 0x44E10838, AM335X_PIN_INPUT  | 6, 32); //mode 6

   //lcd data7 - output (DIGIO)
   dsDAP_mem.writeData(0, 0x44E108BC, AM335X_PIN_OUTPUT | 4, 32); //mode 4
}

//****************************************************************************
// getErrorCode
//****************************************************************************
function getErrorCode(exception)
{
   var ex2 = exception.javaException;
   if (ex2 instanceof Packages.com.ti.ccstudio.scripting.environment.ScriptingException)
   {
      return ex2.getErrorID();
   }
   return 0;
}

/*
 *
 * Copyright (C) 2015 Texas Instruments Incorporated - http://www.ti.com/ 
 * 
 * 
 *  Redistribution and use in source and binary forms, with or without 
 *  modification, are permitted provided that the following conditions 
 *  are met:
 *
 *    Redistributions of source code must retain the above copyright 
 *    notice, this list of conditions and the following disclaimer.
 *
 *    Redistributions in binary form must reproduce the above copyright
 *    notice, this list of conditions and the following disclaimer in the 
 *    documentation and/or other materials provided with the   
 *    distribution.
 *
 *    Neither the name of Texas Instruments Incorporated nor the names of
 *    its contributors may be used to endorse or promote products derived
 *    from this software without specific prior written permission.
 *
 *  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS 
 *  "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT 
 *  LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 *  A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT 
 *  OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, 
 *  SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT 
 *  LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 *  DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 *  THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT 
 *  (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE 
 *  OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
*/

